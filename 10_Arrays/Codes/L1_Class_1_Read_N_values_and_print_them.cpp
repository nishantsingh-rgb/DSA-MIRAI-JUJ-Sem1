#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cout << "How many values? ";
    cin >> n;

    vector<int> arr(n);                 // n boxes, all start at 0
    cout << "Enter " << n << " values: ";
    for (int i = 0; i < n; i++) {
        cin >> arr[i];                  // fill box i
    }
    cout << endl;

    cout << "You entered: ";
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    cout << "First element arr[0]    = " << arr[0] << endl;
    cout << "Last element arr[n - 1] = " << arr[n - 1] << endl;
    return 0;
}
